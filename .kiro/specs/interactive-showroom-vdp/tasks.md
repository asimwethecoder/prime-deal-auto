# Implementation Plan: Interactive Showroom VDP

## Overview

Transform the Vehicle Detail Page (VDP) into an "Interactive Showroom" experience by removing administrative clutter, implementing a tabbed gallery with zoom controls and video support, mapping custom SVG icons, and adding a luxury glassmorphism mobile navigation bar. All implementations use TypeScript with React 19 and Next.js 15.

## Tasks

- [x] 1. Remove Administrative Clutter from CarDetailLayout
  - [x] 1.1 Remove 360 View tab/button from the gallery section
    - Delete the 360 View MediaButton component usage
    - _Requirements: 1.1_
  - [x] 1.2 Remove VIN-related elements from Car Overview and Specifications
    - Remove VIN field from Car Overview section
    - Remove VIN row from Specifications accordion
    - Remove "View Vin Report" ActionButton
    - _Requirements: 1.2, 1.3, 1.5_
  - [x] 1.3 Remove Car Brochure action button
    - Delete "Car Brochure" ActionButton from the actions section
    - _Requirements: 1.4_

- [x] 2. Create Video URL Parsing Utility
  - [x] 2.1 Create parseVideoUrl utility function
    - Create `frontend/lib/utils/parseVideoUrl.ts`
    - Implement YouTube URL parsing (youtube.com/watch?v=, youtu.be/, youtube.com/embed/)
    - Implement Vimeo URL parsing (vimeo.com/, player.vimeo.com/video/)
    - Return ParsedVideo object with provider, videoId, embedUrl, isValid
    - _Requirements: 4.4, 4.5, 4.7_
  - [ ]* 2.2 Write property test for YouTube URL parsing
    - **Property 6: YouTube URL Parsing**
    - **Validates: Requirements 4.4**
  - [ ]* 2.3 Write property test for Vimeo URL parsing
    - **Property 7: Vimeo URL Parsing**
    - **Validates: Requirements 4.5**
  - [ ]* 2.4 Write property test for invalid URL handling
    - **Property 8: Invalid Video URL Handling**
    - **Validates: Requirements 4.7**

- [x] 3. Create Icon Mapping Constants
  - [x] 3.1 Create icon-mapping constants file
    - Create `frontend/lib/constants/icon-mapping.ts`
    - Map specification fields to SVG filenames (Body Type, Drive Type, Condition, Engine Size, Doors, Cylinders, Color)
    - Export CAR_OVERVIEW_ICONS constant
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_
  - [ ]* 3.2 Write unit tests for icon mapping
    - Verify all icon mappings resolve to existing SVG files
    - _Requirements: 5.1-5.7_

- [x] 4. Checkpoint - Ensure utilities are working
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Create VideoPlayer Component
  - [x] 5.1 Create VideoPlayer component
    - Create `frontend/components/cars/VideoPlayer.tsx`
    - Use parseVideoUrl utility to extract embed URL
    - Render responsive iframe with 16:9 aspect ratio
    - Display error fallback for invalid URLs
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.7_
  - [ ]* 5.2 Write unit tests for VideoPlayer
    - Test YouTube embed rendering
    - Test Vimeo embed rendering
    - Test error fallback display
    - _Requirements: 4.1-4.7_

- [x] 6. Create ZoomControls Component
  - [x] 6.1 Create ZoomControls component
    - Create `frontend/components/cars/ZoomControls.tsx`
    - Implement floating control bar with zoom +/- buttons
    - Implement left/right carousel navigation arrows
    - Display current image index (e.g., "1/8")
    - Disable zoom buttons at min/max bounds
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [ ]* 6.2 Write property test for zoom level bounds
    - **Property 3: Zoom Level Bounds**
    - **Validates: Requirements 3.5, 3.6**
  - [ ]* 6.3 Write unit tests for ZoomControls
    - Test button disabled states at bounds
    - Test zoom level display
    - _Requirements: 3.1-3.6_

- [x] 7. Create InteractiveGallery Component
  - [x] 7.1 Create InteractiveGallery component
    - Create `frontend/components/cars/InteractiveGallery.tsx`
    - Implement tabbed interface with "All Photos" and "Video" tabs
    - Hide Video tab when no video_url provided
    - Default to "All Photos" tab on load
    - Implement zoom state management (1.0x to 3.0x in 0.5x steps)
    - Use CSS transform: scale() for GPU-accelerated zoom
    - Implement carousel navigation with wrapping at boundaries
    - Integrate ZoomControls and VideoPlayer components
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12, 3.13_
  - [ ]* 7.2 Write property test for video tab visibility
    - **Property 1: Video Tab Visibility Based on URL**
    - **Validates: Requirements 2.2, 2.3**
  - [ ]* 7.3 Write property test for tab content switching
    - **Property 2: Tab Content Switching**
    - **Validates: Requirements 2.5**
  - [ ]* 7.4 Write property test for carousel navigation wrapping
    - **Property 5: Carousel Navigation Wrapping**
    - **Validates: Requirements 3.10, 3.11, 3.12, 3.13**
  - [ ]* 7.5 Write property test for layout stability during zoom
    - **Property 4: Layout Stability During Zoom**
    - **Validates: Requirements 3.8, 7.4**
  - [ ]* 7.6 Write property test for carousel transition stability
    - **Property 10: Carousel Transition Stability**
    - **Validates: Requirements 7.2**

- [x] 8. Checkpoint - Ensure gallery components are working
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Create MobileNavigation Component
  - [x] 9.1 Create MobileNavigation component
    - Create `frontend/components/layout/MobileNavigation.tsx`
    - Implement glassmorphism styling (bg-white/60, backdrop-blur-xl, border-t border-white/20)
    - Add safe area padding for device notches
    - Display four nav icons: Home, Cars, Contact, Search
    - Implement navigation links for Home, Cars, Contact
    - Implement scroll-to-search action for Search icon
    - Show only on mobile viewport (< 640px)
    - Use fixed positioning at bottom with appropriate z-index
    - Add backdrop-filter fallback for unsupported browsers
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10_
  - [ ]* 9.2 Write property test for mobile navigation routing
    - **Property 9: Mobile Navigation Routing**
    - **Validates: Requirements 6.5, 6.6, 6.7**
  - [ ]* 9.3 Write unit tests for MobileNavigation
    - Test icon rendering
    - Test navigation links
    - Test responsive visibility
    - _Requirements: 6.1-6.10_

- [x] 10. Update CarDetailLayout Integration
  - [x] 10.1 Integrate InteractiveGallery into CarDetailLayout
    - Replace existing gallery section with InteractiveGallery component
    - Pass images, carName, and videoUrl props
    - _Requirements: 2.1-2.5, 3.1-3.13_
  - [x] 10.2 Update Car Overview to use custom icon mapping
    - Import CAR_OVERVIEW_ICONS constant
    - Apply icon mapping to specification fields
    - Set icon size to 24x24 pixels
    - Apply color #050B20 default, #405FF2 on hover/active
    - _Requirements: 5.1-5.10_
  - [x] 10.3 Add MobileNavigation to car detail page
    - Import and render MobileNavigation component
    - Ensure proper z-index layering
    - _Requirements: 6.1-6.10_

- [x] 11. Animation and Performance Optimization
  - [x] 11.1 Implement smooth animations
    - Add CSS transitions for zoom operations (0.2s ease-out)
    - Add will-change: transform for GPU hints
    - Implement subtle pulse animation for Video tab play icon
    - Ensure no layout shifts during zoom/carousel operations
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [x] 12. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties from the design document
- All components use TypeScript with strict typing
- CSS transforms are used for zoom to ensure GPU acceleration and prevent CLS
- Glassmorphism includes fallback for browsers without backdrop-filter support
