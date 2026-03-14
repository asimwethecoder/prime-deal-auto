# Implementation Plan: Frontend Foundation + First Deploy

## Overview

This implementation plan establishes the Next.js 15 frontend application for Prime Deal Auto, connecting to the existing backend APIs to display the car inventory. The approach follows a deploy-early-iterate-often strategy: we'll scaffold the core infrastructure first, then build pages incrementally, deploying at each major milestone.

The implementation uses React Server Components by default for optimal performance, with Client Components only where interactivity is required. All styling uses Tailwind CSS v4 with mobile-first responsive design. The frontend will be deployed to AWS Amplify hosting and integrated with the existing REST API.

## Tasks

- [x] 1. Initialize Next.js 15 project and configure dependencies
  - Create Next.js 15 app with App Router in `frontend/` directory
  - Install dependencies: TanStack Query v5, Zustand, Tailwind CSS v4, Framer Motion, Lucide React, Zod
  - Configure TypeScript with strict mode enabled
  - Set up Tailwind CSS v4 configuration
  - Configure next.config.js with CloudFront image domain
  - Create .env.local.example with required environment variables
  - _Requirements: 14.1, 14.3, 15.4_

- [ ]* 1.1 Write property test for environment variable validation
  - **Property 1: Environment validation completeness**
  - **Validates: Requirements 15.7**

- [x] 2. Set up API client infrastructure
  - [x] 2.1 Create TypeScript interfaces for API responses
    - Define Car, PaginatedResponse, ApiResponse, ApiError types
    - Match backend response format exactly
    - _Requirements: 1.7, 14.1_
  
  - [x] 2.2 Implement base fetch wrapper in lib/api/client.ts
    - Create fetchApi function with base URL configuration
    - Add Authorization header when token is available
    - Parse JSON responses and handle errors
    - Throw descriptive errors for network failures and non-2xx responses
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [x] 2.3 Create domain-specific API modules
    - Implement lib/api/cars.ts with getCars, getCar functions
    - Implement lib/api/search.ts with search function
    - Implement lib/api/chat.ts with sendMessage function
    - All functions return properly typed responses
    - _Requirements: 1.6, 1.7, 14.7_

- [ ]* 2.4 Write unit tests for API client error handling
  - Test network error scenarios
  - Test non-2xx response handling
  - Test JSON parsing errors
  - _Requirements: 1.4, 1.5_

- [x] 3. Configure TanStack Query
  - Create lib/query-client.ts with QueryClient configuration
  - Set default cache time to 5 minutes
  - Configure retry logic (2 retries with exponential backoff)
  - Create QueryClientProvider wrapper component
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 4. Implement root layout and global providers
  - [x] 4.1 Create app/layout.tsx with metadata and providers
    - Set metadataBase URL
    - Configure title template and default metadata
    - Add Open Graph and Twitter card defaults
    - Wrap children with QueryClientProvider
    - Configure next/font for optimized font loading
    - _Requirements: 3.6, 3.7, 9.1, 9.2_
  
  - [x] 4.2 Create Header component
    - Build components/layout/Header.tsx as Client Component
    - Display Prime Deal Auto logo
    - Add navigation links (Home, Browse Cars, Contact)
    - Implement mobile menu with hamburger icon
    - Make responsive (collapse on mobile <640px)
    - _Requirements: 3.1, 3.3, 3.4, 8.5_
  
  - [x] 4.3 Create Footer component
    - Build components/layout/Footer.tsx as Server Component
    - Display copyright information
    - Add social media links
    - Make responsive across all screen sizes
    - _Requirements: 3.2, 3.5, 3.8_

- [x] 5. Create reusable UI components
  - [x] 5.1 Build CarCard component
    - Create components/cars/CarCard.tsx
    - Display car image, make, model, year, price, mileage, transmission
    - Format price in ZAR with R prefix (e.g., R250,000)
    - Format mileage with km suffix and thousand separators
    - Make clickable to navigate to car detail page
    - Responsive design (full width mobile, grid item tablet/desktop)
    - _Requirements: 4.5, 4.6, 5.3, 5.11_
  
  - [x] 5.2 Build Pagination component
    - Create components/ui/Pagination.tsx as Client Component
    - Display Previous, Next, and page number buttons
    - Handle page change events
    - Disable Previous on first page, Next on last page
    - Responsive design with touch-friendly buttons
    - _Requirements: 5.5, 5.6, 8.3_
  
  - [x] 5.3 Build Skeleton loading components
    - Create components/ui/Skeleton.tsx for generic skeleton
    - Create components/cars/CarCardSkeleton.tsx
    - Create components/cars/CarDetailSkeleton.tsx
    - Match content layout for smooth loading experience
    - _Requirements: 10.1, 10.4_

- [x] 6. Implement utility functions
  - Create lib/utils/format.ts with formatPrice and formatMileage functions
  - Create lib/utils/validation.ts with Zod schemas for forms
  - Ensure formatPrice uses en_ZA locale and R prefix
  - Ensure formatMileage uses thousand separators and km suffix
  - _Requirements: 4.6, 5.11, 6.9, 6.10_

- [ ] 7. Checkpoint - Verify infrastructure setup
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement Home page
  - [x] 8.1 Create app/(public)/page.tsx as Server Component
    - Implement hero section with headline and CTA button
    - Fetch featured cars from GET /cars?limit=6 with ISR revalidation of 60 seconds
    - Display featured cars in responsive grid (1 col mobile, 2 tablet, 3 desktop)
    - Add "Browse All Cars" button linking to /cars
    - Handle loading state with skeleton placeholders
    - Handle error state with error message
    - Set page-specific metadata
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.7, 4.8, 4.9, 4.10, 9.3, 11.5_
  
  - [x] 8.2 Create components/home/HeroSection.tsx
    - Build hero section with headline and CTA
    - Make fully responsive with mobile-first design
    - Use placeholder styles (will be updated with Figma design)
    - _Requirements: 4.1, 4.10, 13.8_
  
  - [x] 8.3 Create components/home/FeaturedCars.tsx
    - Display grid of CarCard components
    - Responsive grid layout (1/2/3 columns)
    - _Requirements: 4.5, 8.6_

- [ ]* 8.4 Write property test for price formatting consistency
  - **Property 2: Price formatting consistency**
  - **Validates: Requirements 4.6, 5.11**

- [x] 9. Implement Car Listing page
  - [x] 9.1 Create app/(public)/cars/page.tsx as Server Component
    - Fetch cars from GET /cars with pagination using searchParams
    - Display cars in responsive grid (1 col mobile, 2 tablet, 3 desktop)
    - Implement pagination with 20 cars per page
    - Handle loading state with skeleton placeholders
    - Handle empty state with "No cars found" message
    - Handle error state with error message and retry button
    - Set page-specific metadata
    - _Requirements: 5.1, 5.2, 5.4, 5.7, 5.8, 5.9, 5.10, 9.4_
  
  - [x] 9.2 Create app/(public)/cars/loading.tsx
    - Display grid of CarCardSkeleton components
    - Match the layout of the main page
    - _Requirements: 10.1, 10.4_
  
  - [x] 9.3 Create app/(public)/cars/error.tsx
    - Display user-friendly error message
    - Include retry button
    - Log error to console
    - _Requirements: 10.2, 10.3, 10.7_

- [ ]* 9.4 Write unit tests for pagination logic
  - Test page calculation from offset
  - Test hasMore calculation
  - Test boundary conditions (first page, last page)
  - _Requirements: 5.4, 5.5_

- [x] 10. Implement Car Detail page
  - [x] 10.1 Create app/(public)/cars/[carId]/page.tsx as Server Component
    - Fetch car details from GET /cars/:id with ISR revalidation of 300 seconds
    - Display all car specifications (make, model, year, price, mileage, etc.)
    - Render ImageGallery component with car photos
    - Display features as badges/chips
    - Display description text
    - Add "Contact Dealer" button (placeholder)
    - Handle loading state with skeleton placeholders
    - Handle 404 state with not found message
    - Handle error state with error message and retry button
    - Generate dynamic metadata with car details and Open Graph image
    - _Requirements: 6.1, 6.2, 6.8, 6.9, 6.10, 6.11, 6.12, 6.13, 6.14, 6.15, 6.16, 9.5, 9.6, 11.6_
  
  - [x] 10.2 Create components/cars/ImageGallery.tsx as Client Component
    - Display large primary image
    - Display thumbnail navigation below
    - Update primary image when thumbnail is clicked
    - Implement keyboard navigation (arrow keys)
    - Use next/image with proper width/height to prevent layout shift
    - Handle image load errors with placeholder
    - _Requirements: 6.3, 6.4, 6.5, 7.2, 7.5, 7.7_
  
  - [x] 10.3 Create components/cars/SpecificationsTable.tsx
    - Display car specifications in a clean table/grid layout
    - Format all values appropriately (price, mileage, etc.)
    - Responsive design
    - _Requirements: 6.2, 6.9, 6.10_
  
  - [x] 10.4 Create app/(public)/cars/[carId]/loading.tsx
    - Display CarDetailSkeleton component
    - _Requirements: 10.1, 10.4_
  
  - [x] 10.5 Create app/(public)/cars/[carId]/not-found.tsx
    - Display custom 404 message
    - Include link back to car listing page
    - _Requirements: 6.12, 10.6_

- [ ]* 10.6 Write property test for image gallery navigation
  - **Property 3: Image gallery state consistency**
  - **Validates: Requirements 6.4, 6.5**

- [x] 11. Implement image optimization
  - Configure next.config.js with CloudFront domain in images.remotePatterns
  - Ensure all car images use next/image component
  - Set priority prop on hero/featured car images
  - Set width and height on all images to prevent CLS
  - Implement placeholder image for failed loads
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 11.8_

- [x] 12. Implement SEO features
  - [x] 12.1 Create app/robots.ts
    - Allow all crawlers on public pages
    - Disallow /admin and /dashboard routes
    - Reference sitemap URL
    - _Requirements: 9.9_
  
  - [x] 12.2 Create app/sitemap.ts
    - Fetch all active cars from API
    - Generate entries for home, cars listing, and individual car pages
    - Set appropriate changeFrequency and priority
    - _Requirements: 9.10_
  
  - [x] 12.3 Create app/llms.txt/route.ts
    - Implement Route Handler returning markdown content
    - Include site description and key pages
    - Set Content-Type to text/markdown
    - _Requirements: 9.9 (extended SEO)_
  
  - [x] 12.4 Add structured data (JSON-LD) to Car Detail page
    - Implement Car schema with all relevant properties
    - Include Offer schema with price in ZAR
    - Sanitize JSON output to prevent XSS
    - _Requirements: 9.6_
  
  - [x] 12.5 Ensure semantic HTML and accessibility
    - Use semantic elements (header, nav, main, footer, article, section)
    - Add descriptive alt text to all images
    - Ensure proper heading hierarchy
    - _Requirements: 9.7, 9.8_

- [ ]* 12.6 Write property test for metadata generation
  - **Property 4: Metadata completeness**
  - **Validates: Requirements 9.3, 9.4, 9.5**

- [x] 13. Implement error boundaries and loading states
  - Create app/error.tsx for global error boundary
  - Create app/not-found.tsx for custom 404 page
  - Ensure all async operations have loading states
  - Ensure all error states include retry functionality
  - _Requirements: 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

- [x] 14. Optimize performance
  - [x] 14.1 Minimize client-side JavaScript
    - Audit all 'use client' directives
    - Convert components to Server Components where possible
    - Use dynamic imports for heavy components (ImageGallery lightbox)
    - _Requirements: 11.2, 11.3, 11.4, 11.7_
  
  - [x] 14.2 Configure caching strategies
    - Verify ISR revalidation on Home page (60s)
    - Verify ISR revalidation on Car Detail page (300s)
    - Configure appropriate cache headers
    - _Requirements: 11.5, 11.6_
  
  - [ ] 14.3 Run Lighthouse audit
    - Test on mobile and desktop
    - Verify performance score ≥80
    - Verify Core Web Vitals (LCP <2.5s, CLS <0.1, INP <200ms)
    - Address any issues found
    - _Requirements: 11.1, 11.8_

- [ ]* 14.4 Write property test for Core Web Vitals thresholds
  - **Property 5: Performance metrics within bounds**
  - **Validates: Requirements 11.8**

- [x] 15. Create Amplify Hosting CDK stack
  - [x] 15.1 Implement infrastructure/lib/stacks/hosting-stack.ts
    - Create Amplify App resource
    - Configure build settings for Next.js 15 App Router
    - Set environment variables (NEXT_PUBLIC_API_URL)
    - Configure custom domain (if provided)
    - Enable automatic deployments from main branch
    - Configure CloudFront image domain
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.9_
  
  - [x] 15.2 Add HostingStack to infrastructure/bin/app.ts
    - Import and instantiate HostingStack
    - Pass required dependencies (API URL)
    - Ensure proper deployment order
    - _Requirements: 12.1_
  
  - [x] 15.3 Create amplify.yml build specification
    - Configure build commands for Next.js
    - Set Node.js version to 20
    - Configure output directory
    - Set environment variables
    - _Requirements: 12.2, 12.7_

- [x]* 15.4 Write unit test for HostingStack
  - Assert Amplify App resource exists
  - Assert environment variables are set
  - Assert build settings are correct
  - _Requirements: 12.1, 12.4_

- [x] 16. Deploy frontend to Amplify
  - Run `npx cdk deploy PrimeDeals-Hosting --profile prime-deal-auto`
  - Verify deployment completes successfully
  - Test preview URL to ensure app loads
  - Verify API connectivity
  - Test all pages (home, listing, detail)
  - _Requirements: 12.1, 12.8_

- [x] 17. Implement responsive design polish
  - [x] 17.1 Audit mobile experience
    - Test all pages on mobile viewport (<640px)
    - Verify touch targets are ≥44x44px
    - Verify mobile menu works correctly
    - Verify grid layouts collapse to 1 column
    - _Requirements: 8.1, 8.2, 8.3, 8.5, 8.6_
  
  - [x] 17.2 Audit tablet experience
    - Test all pages on tablet viewport (640-1024px)
    - Verify grid layouts show 2 columns
    - Verify navigation is appropriate
    - _Requirements: 8.1, 8.2, 8.6_
  
  - [x] 17.3 Audit desktop experience
    - Test all pages on desktop viewport (>1024px)
    - Verify grid layouts show 3 columns
    - Verify spacing and typography scale appropriately
    - _Requirements: 8.1, 8.2, 8.4, 8.6, 8.7_

- [ ] 18. Create development documentation
  - Create frontend/README.md with setup instructions
  - Document available npm scripts
  - Document environment variables
  - Document project structure
  - Document component patterns
  - _Requirements: 15.5, 15.6_

- [ ] 19. Final checkpoint - End-to-end testing
  - Ensure all tests pass, ask the user if questions arise.
  - Verify all pages load correctly
  - Verify navigation works across all pages
  - Verify responsive design on all breakpoints
  - Verify SEO metadata is present
  - Verify images load and optimize correctly
  - Verify error states work correctly
  - Verify loading states work correctly

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Figma design integration (Requirement 13) will be implemented after user provides design screenshots - using placeholder styles for now
- The "Contact Dealer" button on car detail pages is a placeholder for the future leads feature
- All prices must use ZAR currency with R prefix (e.g., R250,000)
- All mileage must use km suffix with thousand separators
- Deploy early and iterate - aim to have a working skeleton deployed by task 16
- Server Components are preferred for all pages; only use Client Components for interactivity
- TanStack Query is configured but primarily used for future client-side features (favorites, chat)
- Property-based tests are optional but recommended for critical business logic (price formatting, pagination)

## Additional Pages Built (Beyond Original Spec)

The following pages and components were built by Cursor beyond the original spec requirements:

- [x] About page (`/about`) with:
  - AboutFaq component (accordion FAQ)
  - AboutGallery component (masonry image gallery with animations)
  - AboutStats component (animated counters)
  - AboutBrandsCarousel component
  
- [x] Contact page (`/contact`) with ContactForm component

- [x] Authentication pages:
  - Sign In page (`/signin`) with SignInForm component
  - Sign Up page (`/signup`) with SignUpForm component

- [x] Enhanced search/filter components:
  - FilterSidebar with faceted search (make, model, variant, price, year, transmission, fuel type, body type, condition)
  - SortDropdown component
  - CarsPageClient with mobile filter toggle

- [x] Enhanced home page sections:
  - HeroCarousel (image carousel background)
  - BrandCarousel (brand logos)
  - Customer reviews section
  - Blog posts section (placeholder)
  - CTA banners (Looking for a Car / Want to Sell)
  - Why Choose Us section

- [x] Car detail enhancements:
  - CarDetailLayout component
  - Related cars carousel
