# Requirements Document

## Introduction

This specification defines the requirements for the Frontend Foundation + First Deploy feature, which establishes the core Next.js 15 frontend application for Prime Deal Auto. This is the first user-facing implementation that connects to the existing backend APIs to display the car inventory. The frontend will be built using React Server Components where possible, with a mobile-first responsive design approach, and deployed to AWS Amplify hosting.

The feature provides the essential pages needed for users to browse and view cars: a home page with featured vehicles, a listing page with pagination, and detailed car pages with image galleries and specifications. The implementation will integrate with the existing REST API endpoints for cars, search, and chat that are already deployed and operational.

## Glossary

- **Frontend_App**: The Next.js 15 application using App Router architecture
- **API_Client**: The fetch wrapper module that handles HTTP requests to the backend REST API
- **Server_Component**: React Server Component that renders on the server and can directly fetch data
- **Client_Component**: React component marked with 'use client' that runs in the browser and handles interactivity
- **TanStack_Query**: Client-side data fetching and caching library (formerly React Query v5)
- **Car_Listing_Page**: The page displaying all active cars with pagination at /cars route
- **Car_Detail_Page**: The page displaying a single car's full information at /cars/[carId] route
- **Home_Page**: The landing page at / route with hero section and featured cars
- **Header_Component**: The site-wide navigation component in the root layout
- **Footer_Component**: The site-wide footer component in the root layout
- **Image_Gallery**: The component displaying car photos with thumbnail navigation
- **Amplify_Hosting**: AWS Amplify service for hosting the Next.js application
- **Backend_API**: The existing REST API at https://urwy8bxz7g.execute-api.us-east-1.amazonaws.com/v1/
- **Figma_Design**: The design mockups and specifications provided by the user for visual implementation

## Requirements

### Requirement 1: API Client Infrastructure

**User Story:** As a developer, I want a centralized API client module, so that all HTTP requests to the backend are consistent and maintainable.

#### Acceptance Criteria

1. THE API_Client SHALL provide a fetch wrapper function that includes the Backend_API base URL
2. THE API_Client SHALL include the Authorization header when an authentication token is available
3. THE API_Client SHALL parse JSON responses and return typed data objects
4. WHEN a request fails with a network error, THE API_Client SHALL throw a descriptive error
5. WHEN a response has a non-2xx status code, THE API_Client SHALL throw an error with the status and message
6. THE API_Client SHALL provide domain-specific modules for cars, search, and chat endpoints
7. THE API_Client SHALL use TypeScript interfaces that match the backend response format

### Requirement 2: TanStack Query Setup

**User Story:** As a developer, I want TanStack Query configured for client-side data fetching, so that I have automatic caching, loading states, and error handling.

#### Acceptance Criteria

1. THE Frontend_App SHALL initialize a QueryClient with appropriate default options
2. THE Frontend_App SHALL wrap the application with QueryClientProvider in the root layout
3. THE QueryClient SHALL cache successful queries for 5 minutes by default
4. THE QueryClient SHALL retry failed requests up to 2 times with exponential backoff
5. WHERE a component needs client-side data fetching, THE Frontend_App SHALL use TanStack_Query hooks

### Requirement 3: Root Layout Structure

**User Story:** As a user, I want consistent navigation and branding across all pages, so that I can easily navigate the site.

#### Acceptance Criteria

1. THE Frontend_App SHALL render a Header_Component at the top of every page
2. THE Frontend_App SHALL render a Footer_Component at the bottom of every page
3. THE Header_Component SHALL display the Prime Deal Auto logo
4. THE Header_Component SHALL include navigation links to Home, Browse Cars, and Contact pages
5. THE Footer_Component SHALL display copyright information and social media links
6. THE Frontend_App SHALL apply site-wide metadata including title, description, and Open Graph tags
7. THE Frontend_App SHALL use the next/font system for optimized font loading
8. THE Frontend_App SHALL be responsive across mobile, tablet, and desktop screen sizes

### Requirement 4: Home Page Implementation

**User Story:** As a visitor, I want to see an engaging home page with featured cars, so that I can quickly find interesting vehicles.

#### Acceptance Criteria

1. THE Home_Page SHALL render a hero section with a headline and call-to-action button
2. THE Home_Page SHALL fetch and display up to 6 featured cars from the Backend_API
3. WHEN the featured cars are loading, THE Home_Page SHALL display skeleton loading placeholders
4. WHEN the featured cars fail to load, THE Home_Page SHALL display an error message
5. THE Home_Page SHALL render each featured car with an image, make, model, year, price, and mileage
6. THE Home_Page SHALL format prices in ZAR currency with the R prefix (e.g., R250,000)
7. THE Home_Page SHALL use Server_Component for initial data fetching with ISR revalidation of 60 seconds
8. WHEN a user clicks a featured car, THE Home_Page SHALL navigate to the Car_Detail_Page for that car
9. THE Home_Page SHALL include a "Browse All Cars" button that navigates to the Car_Listing_Page
10. THE Home_Page SHALL be fully responsive with mobile-first design

### Requirement 5: Car Listing Page Implementation

**User Story:** As a user, I want to browse all available cars with pagination, so that I can explore the full inventory.

#### Acceptance Criteria

1. THE Car_Listing_Page SHALL fetch active cars from the Backend_API GET /cars endpoint
2. THE Car_Listing_Page SHALL display cars in a grid layout (1 column on mobile, 2 on tablet, 3 on desktop)
3. THE Car_Listing_Page SHALL render each car with an image, make, model, year, price, mileage, and transmission
4. THE Car_Listing_Page SHALL implement pagination with 20 cars per page
5. THE Car_Listing_Page SHALL display pagination controls (Previous, Next, and page numbers)
6. WHEN a user clicks a pagination control, THE Car_Listing_Page SHALL fetch and display the corresponding page
7. WHEN the cars are loading, THE Car_Listing_Page SHALL display skeleton loading placeholders
8. WHEN no cars are available, THE Car_Listing_Page SHALL display a "No cars found" message
9. WHEN the API request fails, THE Car_Listing_Page SHALL display an error message with a retry button
10. THE Car_Listing_Page SHALL use Server_Component for initial page load with searchParams for pagination
11. THE Car_Listing_Page SHALL format all prices in ZAR currency with the R prefix
12. WHEN a user clicks a car card, THE Car_Listing_Page SHALL navigate to the Car_Detail_Page for that car

### Requirement 6: Car Detail Page Implementation

**User Story:** As a user, I want to view detailed information about a specific car, so that I can make an informed decision.

#### Acceptance Criteria

1. THE Car_Detail_Page SHALL fetch car details from the Backend_API GET /cars/:id endpoint
2. THE Car_Detail_Page SHALL display the car's make, model, year, price, mileage, condition, transmission, fuel type, body type, and color
3. THE Car_Detail_Page SHALL render an Image_Gallery component with all car photos
4. THE Image_Gallery SHALL display a large primary image with thumbnail navigation below
5. WHEN a user clicks a thumbnail, THE Image_Gallery SHALL update the primary image to the selected photo
6. THE Car_Detail_Page SHALL display the car's features as a list of badges or chips
7. THE Car_Detail_Page SHALL display the car's description text
8. THE Car_Detail_Page SHALL include a "Contact Dealer" button (placeholder for future lead form)
9. THE Car_Detail_Page SHALL format the price in ZAR currency with the R prefix
10. THE Car_Detail_Page SHALL format the mileage with km suffix and thousand separators
11. WHEN the car is loading, THE Car_Detail_Page SHALL display skeleton loading placeholders
12. WHEN the car is not found, THE Car_Detail_Page SHALL display a 404 error message
13. WHEN the API request fails, THE Car_Detail_Page SHALL display an error message with a retry button
14. THE Car_Detail_Page SHALL use Server_Component for initial data fetching with ISR revalidation of 300 seconds
15. THE Car_Detail_Page SHALL generate dynamic metadata including the car's title and Open Graph image
16. THE Car_Detail_Page SHALL be fully responsive with mobile-first design

### Requirement 7: Image Optimization

**User Story:** As a user, I want images to load quickly and efficiently, so that I have a smooth browsing experience.

#### Acceptance Criteria

1. THE Frontend_App SHALL use next/image component for all car images
2. THE next/image component SHALL automatically optimize images for the user's device
3. THE next/image component SHALL lazy load images that are below the fold
4. THE next/image component SHALL use the priority prop for above-the-fold hero images
5. THE next/image component SHALL specify width and height attributes to prevent layout shift
6. THE Frontend_App SHALL configure the CloudFront distribution URL as an allowed image domain
7. WHEN an image fails to load, THE Frontend_App SHALL display a placeholder image

### Requirement 8: Responsive Design Implementation

**User Story:** As a user, I want the site to work well on my device, so that I can browse cars on mobile, tablet, or desktop.

#### Acceptance Criteria

1. THE Frontend_App SHALL use Tailwind CSS v4 for all styling
2. THE Frontend_App SHALL implement mobile-first responsive breakpoints (mobile <640px, tablet 640-1024px, desktop >1024px)
3. THE Frontend_App SHALL ensure all interactive elements have touch-friendly sizes on mobile (minimum 44x44px)
4. THE Frontend_App SHALL use responsive typography that scales appropriately across devices
5. THE Frontend_App SHALL ensure the Header_Component collapses to a mobile menu on small screens
6. THE Frontend_App SHALL ensure grid layouts adapt to screen size (1 column mobile, 2 tablet, 3 desktop)
7. THE Frontend_App SHALL test all pages on mobile, tablet, and desktop viewport sizes

### Requirement 9: SEO and Metadata

**User Story:** As a business owner, I want the site to be discoverable by search engines, so that potential customers can find us.

#### Acceptance Criteria

1. THE Frontend_App SHALL set a metadataBase URL in the root layout
2. THE Frontend_App SHALL define default metadata with title template in the root layout
3. THE Home_Page SHALL set page-specific metadata with title and description
4. THE Car_Listing_Page SHALL set page-specific metadata with title and description
5. THE Car_Detail_Page SHALL generate dynamic metadata including the car's make, model, year, and price
6. THE Car_Detail_Page SHALL include Open Graph metadata with the car's primary image
7. THE Frontend_App SHALL use semantic HTML elements (header, nav, main, footer, article, section)
8. THE Frontend_App SHALL ensure all images have descriptive alt text
9. THE Frontend_App SHALL generate a robots.txt file that allows all crawlers
10. THE Frontend_App SHALL generate a sitemap.xml file with all public pages (home, cars listing, and individual car pages)

### Requirement 10: Loading and Error States

**User Story:** As a user, I want clear feedback when content is loading or when errors occur, so that I understand what's happening.

#### Acceptance Criteria

1. WHEN data is loading, THE Frontend_App SHALL display skeleton loading placeholders that match the content layout
2. WHEN an API request fails, THE Frontend_App SHALL display a user-friendly error message
3. THE error message SHALL include a retry button that re-attempts the failed request
4. THE Frontend_App SHALL use Next.js loading.tsx files for route-level loading states
5. THE Frontend_App SHALL use Next.js error.tsx files for route-level error boundaries
6. WHEN a page is not found, THE Frontend_App SHALL display a custom 404 page with navigation back to home
7. THE Frontend_App SHALL log errors to the browser console for debugging purposes

### Requirement 11: Performance Optimization

**User Story:** As a user, I want pages to load quickly, so that I can browse cars without waiting.

#### Acceptance Criteria

1. THE Frontend_App SHALL achieve a Lighthouse performance score of at least 80 on mobile
2. THE Frontend_App SHALL use Server_Component for data fetching wherever possible to reduce client JavaScript
3. THE Frontend_App SHALL only mark components as Client_Component when they require interactivity
4. THE Frontend_App SHALL use dynamic imports for heavy components that are not immediately needed
5. THE Frontend_App SHALL implement ISR (Incremental Static Regeneration) for the Home_Page with 60 second revalidation
6. THE Frontend_App SHALL implement ISR for the Car_Detail_Page with 300 second revalidation
7. THE Frontend_App SHALL minimize the use of client-side JavaScript bundles
8. THE Frontend_App SHALL ensure Core Web Vitals meet acceptable thresholds (LCP <2.5s, CLS <0.1, INP <200ms)

### Requirement 12: Amplify Hosting Deployment

**User Story:** As a developer, I want to deploy the frontend to AWS Amplify, so that it is publicly accessible and integrated with AWS services.

#### Acceptance Criteria

1. THE Frontend_App SHALL be deployed to AWS Amplify hosting in the prime-deal-auto AWS account
2. THE Amplify_Hosting SHALL build the Next.js application using the App Router build output
3. THE Amplify_Hosting SHALL serve the application over HTTPS with a custom domain (if configured)
4. THE Amplify_Hosting SHALL set environment variables for the Backend_API base URL
5. THE Amplify_Hosting SHALL enable automatic deployments from the main Git branch
6. THE Amplify_Hosting SHALL configure the CloudFront distribution URL as an allowed image domain
7. THE Amplify_Hosting SHALL support Next.js 15 Server Components and Server Actions
8. WHEN a deployment completes, THE Amplify_Hosting SHALL provide a preview URL for testing
9. THE Amplify_Hosting SHALL configure appropriate cache headers for static assets

### Requirement 13: Figma Design Integration

**User Story:** As a developer, I want to implement the visual design from Figma, so that the frontend matches the approved design specifications.

#### Acceptance Criteria

1. THE Frontend_App SHALL implement the color scheme defined in the Figma_Design
2. THE Frontend_App SHALL implement the typography (font families, sizes, weights) defined in the Figma_Design
3. THE Frontend_App SHALL implement the spacing and layout grid defined in the Figma_Design
4. THE Frontend_App SHALL implement the component styles (buttons, cards, inputs) defined in the Figma_Design
5. THE Frontend_App SHALL implement the responsive breakpoints and mobile layouts defined in the Figma_Design
6. WHERE the Figma_Design specifies animations or transitions, THE Frontend_App SHALL implement them using Framer Motion
7. THE Frontend_App SHALL maintain visual consistency across all pages according to the Figma_Design
8. WHEN the Figma_Design is not yet provided, THE Frontend_App SHALL use placeholder styles that can be easily updated

### Requirement 14: TypeScript Type Safety

**User Story:** As a developer, I want comprehensive TypeScript types, so that I catch errors at compile time and have better IDE support.

#### Acceptance Criteria

1. THE Frontend_App SHALL define TypeScript interfaces for all API response types
2. THE Frontend_App SHALL define TypeScript interfaces for all component props
3. THE Frontend_App SHALL enable strict TypeScript mode in tsconfig.json
4. THE Frontend_App SHALL avoid using the any type except where absolutely necessary
5. THE Frontend_App SHALL use TypeScript generics for reusable components and utilities
6. THE Frontend_App SHALL ensure all files compile without TypeScript errors
7. THE API_Client SHALL return properly typed responses that match the backend API format

### Requirement 15: Development Experience

**User Story:** As a developer, I want a smooth development workflow, so that I can iterate quickly on the frontend.

#### Acceptance Criteria

1. THE Frontend_App SHALL run a local development server with hot module replacement
2. THE Frontend_App SHALL display TypeScript errors in the terminal during development
3. THE Frontend_App SHALL display ESLint warnings in the terminal during development
4. THE Frontend_App SHALL support environment variables via .env.local for local development
5. THE Frontend_App SHALL include a README with setup instructions and available scripts
6. THE Frontend_App SHALL build successfully without errors or warnings
7. THE Frontend_App SHALL provide clear error messages when environment variables are missing
