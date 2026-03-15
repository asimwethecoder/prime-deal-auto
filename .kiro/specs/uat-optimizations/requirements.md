# Requirements Document

## Introduction

This document defines the requirements for UAT (User Acceptance Testing) optimizations for Prime Deal Auto. The optimizations address five key areas identified during UAT: CloudFront asset migration for performance, AI-powered natural language search for UX differentiation, dynamic filter integration for data accuracy, UI/branding updates for polish, and global auth state persistence for consistency. These improvements will enhance the overall user experience, site performance, and brand presentation.

## Glossary

- **Header_Component**: The site-wide navigation component displayed at the top of all pages, containing the logo, navigation links, and authentication controls
- **Hero_Section**: The prominent banner area on the home page featuring a carousel of background images and the primary search interface
- **CloudFront_Distribution**: The AWS CloudFront CDN distribution used to serve static assets with low latency and high transfer speeds
- **S3_Bucket**: The AWS S3 storage bucket containing car images and static assets for the application
- **Filter_Sidebar**: The component on the Cars page that allows users to filter inventory by make, model, variant, price, year, and other attributes
- **AI_Search_Bar**: A natural language search interface that interprets user queries and maps them to parametric filters
- **Auth_State**: The global authentication state tracking whether a user is signed in and their role (user, dealer, admin)
- **Navbar**: The navigation bar component (alias for Header_Component) that displays authentication status and navigation links
- **Body_Type**: A car classification category such as SUV, Sedan, Hatchback, or Bakkie
- **Parametric_Filters**: Traditional search filters with specific field-value pairs (e.g., make=Toyota, maxPrice=300000)
- **Natural_Language_Query**: A free-form text search query written in conversational language (e.g., "SUVs under R300k")
- **Intent_Matching**: The process of extracting structured filter parameters from a natural language query

## Requirements

### Requirement 1: Logo Visibility Enhancement

**User Story:** As a site visitor, I want the logo to be prominently visible in the header, so that I can easily identify the Prime Deal Auto brand.

#### Acceptance Criteria

1. THE Header_Component SHALL display the logo at 20-25% larger dimensions than the current 120x40 pixel size
2. WHEN the page loads, THE Header_Component SHALL render the logo with dimensions of approximately 150x50 pixels
3. THE Header_Component SHALL maintain the logo aspect ratio when scaling to the larger size
4. WHILE on mobile viewport (width < 640px), THE Header_Component SHALL scale the logo proportionally to fit the available space
5. THE Header_Component SHALL preserve the white background container around the logo on non-transparent header states

### Requirement 2: Hero Section Copy Update

**User Story:** As a marketing stakeholder, I want the hero headline to display "Prime Deal Auto" instead of "Find Your Perfect Car", so that the brand name is prominently featured on the home page.

#### Acceptance Criteria

1. THE Hero_Section SHALL display "Prime Deal Auto" as the primary heading text
2. THE Hero_Section SHALL maintain the existing typography styling (text-5xl sm:text-6xl lg:text-[70px] font-extrabold text-white)
3. THE Hero_Section SHALL retain the existing subheading "Quality used cars at unbeatable prices."

### Requirement 3: Static Image Migration to CloudFront

**User Story:** As a site visitor, I want pages to load quickly, so that I can browse the inventory without delays.

#### Acceptance Criteria

1. THE System SHALL store all hero background images (hero1.jpg through hero6.jpg) in the S3_Bucket
2. THE System SHALL store all about page images in the S3_Bucket
3. THE HeroCarousel component SHALL load images from the CloudFront_Distribution URL instead of local /images/hero/ paths
4. THE About page components SHALL load images from the CloudFront_Distribution URL instead of local /images/about/ paths
5. THE System SHALL retain SVG icons in the local /public/icons/ directory for fast rendering
6. WHEN an image is requested, THE CloudFront_Distribution SHALL serve the image with appropriate cache headers (Cache-Control: max-age=31536000)
7. THE System SHALL configure Next.js Image component with the CloudFront domain in the remotePatterns configuration

### Requirement 4: Cars Page Performance Investigation

**User Story:** As a site visitor, I want the Cars page to load quickly, so that I can browse inventory without experiencing delays.

#### Acceptance Criteria

1. THE System SHALL configure Next.js Image Optimization with appropriate device sizes and image sizes
2. THE System SHALL ensure CloudFront cache headers are correctly configured for car images
3. WHEN car images are loaded, THE System SHALL use appropriate image sizes based on viewport width
4. THE System SHALL implement lazy loading for car images below the fold
5. IF the Cars page load time exceeds 3 seconds, THEN THE System SHALL log performance metrics for investigation

### Requirement 5: Dynamic Make/Model/Variant Filter Integration

**User Story:** As a car shopper, I want the Make, Model, and Variant dropdowns to show only values that exist in the current inventory, so that I can filter to cars that are actually available.

#### Acceptance Criteria

1. WHEN the Cars page loads, THE Filter_Sidebar SHALL fetch unique make values from the database via the /search/facets endpoint
2. WHEN a make is selected, THE Filter_Sidebar SHALL fetch unique model values for that make from the database
3. WHEN a make and model are selected, THE Filter_Sidebar SHALL fetch unique variant values for that make/model combination from the database
4. THE Filter_Sidebar SHALL display the count of matching cars next to each filter option
5. WHEN the inventory changes, THE Filter_Sidebar SHALL reflect the updated unique values on the next page load
6. IF no cars match the selected filters, THEN THE Filter_Sidebar SHALL display an empty state message
7. THE Filter_Sidebar SHALL disable the Model dropdown until a Make is selected
8. THE Filter_Sidebar SHALL disable the Variant dropdown until both Make and Model are selected

### Requirement 6: Hero Category Icon Routing

**User Story:** As a car shopper, I want to click on category icons (SUV, Sedan, etc.) on the home page and be taken to a filtered car listing, so that I can quickly browse cars of a specific type.

#### Acceptance Criteria

1. WHEN a user clicks the SUV category icon, THE System SHALL navigate to /cars?bodyType=SUV
2. WHEN a user clicks the Sedan category icon, THE System SHALL navigate to /cars?bodyType=Sedan
3. WHEN a user clicks the Hatchback category icon, THE System SHALL navigate to /cars?bodyType=Hatchback
4. WHEN a user clicks the Bakkie category icon, THE System SHALL navigate to /cars?bodyType=Bakkie
5. THE Cars page SHALL apply the bodyType filter from the URL query parameter and display matching results

### Requirement 7: AI-Powered Natural Language Search Bar

**User Story:** As a car shopper, I want to search using natural language queries like "SUVs under R300k", so that I can find cars without navigating complex filter menus.

#### Acceptance Criteria

1. THE Hero_Section SHALL display a natural language search input field above or integrated with the existing filter dropdowns
2. WHEN a user enters a natural language query, THE AI_Search_Bar SHALL interpret the query and extract filter parameters
3. THE AI_Search_Bar SHALL map price-related phrases (e.g., "under R300k", "below 500000", "between R200k and R400k") to minPrice and maxPrice parameters
4. THE AI_Search_Bar SHALL map body type phrases (e.g., "SUV", "sedan", "hatchback", "bakkie") to the bodyType parameter
5. THE AI_Search_Bar SHALL map make and model mentions (e.g., "Toyota", "BMW X5") to make and model parameters
6. THE AI_Search_Bar SHALL map year phrases (e.g., "2020 or newer", "after 2018") to minYear and maxYear parameters
7. THE AI_Search_Bar SHALL map fuel type phrases (e.g., "diesel", "electric", "hybrid") to the fuelType parameter
8. THE AI_Search_Bar SHALL map transmission phrases (e.g., "automatic", "manual") to the transmission parameter
9. WHEN the user submits the query, THE System SHALL navigate to /cars with the extracted parameters as query string
10. IF the AI_Search_Bar cannot interpret the query, THEN THE System SHALL fall back to a full-text search using the q parameter
11. THE AI_Search_Bar SHALL provide visual feedback while processing the natural language query

### Requirement 8: Cars Page Search Button

**User Story:** As a car shopper, I want a prominent search button at the bottom of the filter sidebar, so that I can easily apply my selected filters.

#### Acceptance Criteria

1. THE Filter_Sidebar SHALL display a prominent "Search" button at the bottom of the filter panel
2. WHEN the user clicks the Search button, THE System SHALL apply all selected filters and refresh the car listing
3. THE Search button SHALL use the secondary color (#405FF2) with white text
4. THE Search button SHALL have a minimum touch target of 44x44 pixels for accessibility

### Requirement 9: Global Auth State in Navbar

**User Story:** As a signed-in user, I want the navigation bar to reflect my authentication status on all pages, so that I know I am logged in and can access my account.

#### Acceptance Criteria

1. WHEN a user is signed in, THE Header_Component SHALL display the user's profile link or dashboard link instead of "Sign In"
2. WHEN a user is signed in, THE Header_Component SHALL hide the "Register" link
3. WHEN a user is not signed in, THE Header_Component SHALL display "Sign In" and "Register" links
4. THE Header_Component SHALL check authentication status on initial page load and after navigation
5. WHILE the authentication status is being determined, THE Header_Component SHALL display a loading state or the signed-out state to prevent layout shift
6. WHEN a user signs out, THE Header_Component SHALL immediately update to show the signed-out state

### Requirement 10: Staff Dashboard Access

**User Story:** As a staff member (dealer or admin), I want to see a dashboard link in the navigation when signed in, so that I can quickly access administrative functions.

#### Acceptance Criteria

1. WHEN a user with admin role is signed in, THE Header_Component SHALL display a "Dashboard" link
2. WHEN a user with dealer role is signed in, THE Header_Component SHALL display a "Dashboard" link
3. THE Dashboard link SHALL navigate to /dashboard
4. WHEN a regular user (non-staff) is signed in, THE Header_Component SHALL display a "My Account" or profile link instead of "Dashboard"
5. THE Header_Component SHALL determine user role from the Cognito JWT token claims (cognito:groups)
