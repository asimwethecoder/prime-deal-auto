# Implementation Plan: UAT Optimizations

## Overview

This implementation plan addresses UAT optimizations for Prime Deal Auto in priority order: CloudFront migration (performance), AI Search Bar (UX differentiator), Dynamic filters (data accuracy), UI/branding (polish), and Auth state (consistency). Tasks are ordered to deliver highest-impact changes first.

## Tasks

- [x] 1. CloudFront Static Image Migration
  - [x] 1.1 Upload hero images to S3 bucket
    - Upload hero1.jpg through hero6.jpg to `s3://prime-deal-auto-assets/static/hero/`
    - Verify images are accessible via CloudFront distribution
    - _Requirements: 3.1_
  
  - [x] 1.2 Upload about page images to S3 bucket
    - Upload all about page images to `s3://prime-deal-auto-assets/static/about/`
    - Verify images are accessible via CloudFront distribution
    - _Requirements: 3.2_
  
  - [x] 1.3 Update Next.js image configuration
    - Add `/static/**` pathname to remotePatterns in `next.config.ts`
    - Configure deviceSizes and imageSizes for optimal loading
    - _Requirements: 3.7, 4.1_
  
  - [x] 1.4 Update HeroCarousel to use CloudFront URLs
    - Replace local `/images/hero/` paths with CloudFront URLs using `NEXT_PUBLIC_CLOUDFRONT_URL`
    - Verify images load correctly from CDN
    - _Requirements: 3.3_
  
  - [x] 1.5 Update About page to use CloudFront URLs
    - Replace local `/images/about/` paths with CloudFront URLs
    - Verify images load correctly from CDN
    - _Requirements: 3.4_
  
  - [ ]* 1.6 Write property test for CloudFront image URLs
    - **Property 1: CloudFront Image URLs**
    - **Validates: Requirements 3.3, 3.4**

- [x] 2. Checkpoint - Verify CloudFront migration
  - Ensure all hero and about images load from CloudFront
  - Verify cache headers are set correctly (max-age=31536000)
  - Ask the user if questions arise

- [x] 3. AI-Powered Natural Language Search Bar
  - [x] 3.1 Create intent parsing API endpoint
    - Add `POST /search/intent` handler in backend
    - Implement Bedrock integration with intent parsing system prompt
    - Return structured filters with confidence score
    - _Requirements: 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_
  
  - [x] 3.2 Create AISearchBar component
    - Create `frontend/components/home/AISearchBar.tsx`
    - Implement text input with search icon and loading state
    - Call `/search/intent` API on submit
    - _Requirements: 7.1, 7.11_
  
  - [x] 3.3 Implement search navigation with extracted filters
    - Navigate to `/cars` with extracted filter parameters as query string
    - Fall back to `?q=<query>` if parsing fails or confidence is low
    - _Requirements: 7.9, 7.10_
  
  - [x] 3.4 Integrate AISearchBar into Cars page FilterSidebar
    - Add AISearchBar above classic filter dropdowns in FilterSidebar
    - Style consistently with design system (white background context)
    - _Requirements: 7.1_
  
  - [ ]* 3.5 Write property test for intent parsing filter extraction
    - **Property 7: Intent Parsing Filter Extraction**
    - **Validates: Requirements 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8**
  
  - [ ]* 3.6 Write property test for search navigation
    - **Property 8: Search Navigation with Extracted Filters**
    - **Validates: Requirements 7.9**

- [x] 4. Checkpoint - Verify AI Search Bar
  - Test natural language queries like "SUVs under R300k", "Toyota automatic"
  - Verify fallback to full-text search works
  - Ask the user if questions arise

- [x] 5. Dynamic Make/Model/Variant Filter Integration
  - [x] 5.1 Implement dependent model query
    - Add TanStack Query for models filtered by selected make
    - Use `enabled` flag to only fetch when make is selected
    - _Requirements: 5.2_
  
  - [x] 5.2 Implement dependent variant query
    - Add TanStack Query for variants filtered by selected make + model
    - Use `enabled` flag to only fetch when both make and model are selected
    - _Requirements: 5.3_
  
  - [x] 5.3 Implement cascading dropdown disabled states
    - Disable Model dropdown until Make is selected
    - Disable Variant dropdown until both Make and Model are selected
    - _Requirements: 5.7, 5.8_
  
  - [x] 5.4 Display facet counts next to filter options
    - Show count of matching cars in format "{value} ({count})"
    - _Requirements: 5.4_
  
  - [x] 5.5 Add Search button to FilterSidebar
    - Add prominent "Search" button at bottom of filter panel
    - Use secondary color (#405FF2) with white text
    - Ensure 44x44px minimum touch target
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  
  - [ ]* 5.6 Write property test for dependent filter queries
    - **Property 2: Dependent Filter Queries**
    - **Validates: Requirements 5.2, 5.3**
  
  - [ ]* 5.7 Write property test for cascading dropdown disabled state
    - **Property 4: Cascading Dropdown Disabled State**
    - **Validates: Requirements 5.7, 5.8**
  
  - [ ]* 5.8 Write property test for facet count display
    - **Property 3: Facet Count Display**
    - **Validates: Requirements 5.4**
  
  - [ ]* 5.9 Write property test for filter search button
    - **Property 9: Filter Search Button Application**
    - **Validates: Requirements 8.2**

- [x] 6. Checkpoint - Verify dynamic filters
  - Test make → model → variant cascading behavior
  - Verify facet counts update correctly
  - Ask the user if questions arise

- [x] 7. UI/Branding Updates
  - [x] 7.1 Increase logo size in Header
    - Update logo dimensions from 120x40 to 150x50 pixels
    - Maintain aspect ratio with `object-contain`
    - Scale proportionally on mobile (< 640px)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [x] 7.2 Update Hero headline copy
    - Change headline from "Find Your Perfect Car" to "Prime Deal Auto"
    - Maintain existing typography styling
    - Retain subheading "Quality used cars at unbeatable prices."
    - _Requirements: 2.1, 2.2, 2.3_

- [x] 8. Category Icon Routing Verification
  - [x] 8.1 Verify body type icon navigation
    - Confirm SUV, Sedan, Hatchback, Bakkie icons navigate to correct URLs
    - Verify Cars page applies bodyType filter from URL query parameter
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [ ]* 8.2 Write property test for category icon navigation
    - **Property 6: Category Icon Navigation**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**
  
  - [ ]* 8.3 Write property test for body type URL filter application
    - **Property 5: Body Type URL Filter Application**
    - **Validates: Requirements 6.5**

- [x] 9. Global Auth State Management
  - [x] 9.1 Create Zustand auth store
    - Create `frontend/lib/stores/auth-store.ts`
    - Implement `initialize()` to check Cognito session
    - Extract `cognito:groups` from JWT for role determination
    - Implement `signOut()` to clear state
    - _Requirements: 9.4, 9.5, 10.5_
  
  - [x] 9.2 Update Header to use auth store
    - Display profile/dashboard link when authenticated
    - Hide "Sign In" and "Register" when authenticated
    - Show "Sign In" and "Register" when not authenticated
    - Show loading state while auth status is being determined
    - _Requirements: 9.1, 9.2, 9.3, 9.5_
  
  - [x] 9.3 Implement role-based dashboard link
    - Display "Dashboard" link for admin or dealer roles
    - Display "My Account" link for regular users
    - Navigate to /dashboard for staff roles
    - _Requirements: 10.1, 10.2, 10.3, 10.4_
  
  - [x] 9.4 Implement sign out state update
    - Immediately update Header to signed-out state on sign out
    - Clear auth store state
    - _Requirements: 9.6_
  
  - [ ]* 9.5 Write property test for auth-dependent header display
    - **Property 10: Auth-Dependent Header Display**
    - **Validates: Requirements 9.1, 9.2, 9.3**
  
  - [ ]* 9.6 Write property test for sign out state update
    - **Property 11: Sign Out State Update**
    - **Validates: Requirements 9.6**
  
  - [ ]* 9.7 Write property test for role-based dashboard link
    - **Property 12: Role-Based Dashboard Link**
    - **Validates: Requirements 10.1, 10.2, 10.4**

- [x] 10. Final checkpoint - Ensure all tests pass
  - Verify all CloudFront images load correctly
  - Test AI Search Bar with various natural language queries
  - Verify dynamic filter cascading behavior
  - Confirm auth state persists across navigation
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Priority order: CloudFront → AI Search → Dynamic Filters → UI/Branding → Auth State
