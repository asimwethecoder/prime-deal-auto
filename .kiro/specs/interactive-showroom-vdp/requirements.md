# Requirements Document

## Introduction

This feature overhauls the Vehicle Detail Page (VDP) to create an "Interactive Showroom" experience. The changes focus on removing administrative clutter (360 View, VIN, Brochure), implementing an enhanced photo gallery with zoom controls and video support, replacing generic icons with custom SVGs, and adding a luxury glassmorphism mobile navigation bar.

## Glossary

- **VDP**: Vehicle Detail Page - the page displaying full details for a single car listing
- **Gallery**: The image/video viewing component on the VDP
- **Zoom_Controls**: Floating control bar with zoom in/out and carousel navigation
- **Video_Player**: Embedded YouTube/Vimeo player for car videos
- **Mobile_Navigation**: Bottom navigation bar visible on mobile devices
- **Glassmorphism**: Visual effect using background blur and transparency for a frosted glass appearance
- **CSS_Transform**: GPU-accelerated scaling using CSS `transform: scale()` property
- **Safe_Area**: Device-specific padding to avoid system UI elements (notch, home indicator)

## Requirements

### Requirement 1: Remove Administrative Clutter

**User Story:** As a car buyer, I want a clean VDP without administrative elements, so that I can focus on the car's visual presentation and key details.

#### Acceptance Criteria

1. THE VDP SHALL NOT display a 360 View tab or any 360 View functionality
2. THE VDP SHALL NOT display the VIN number field in the Car Overview section
3. THE VDP SHALL NOT display the "View VIN Report" action button
4. THE VDP SHALL NOT display the "Car Brochure" action button
5. THE VDP SHALL NOT include VIN in the Specifications accordion

### Requirement 2: Gallery Tab Structure

**User Story:** As a car buyer, I want organized media tabs, so that I can easily switch between photos and video content.

#### Acceptance Criteria

1. THE Gallery SHALL display tabs in the order: "All Photos" | "Video"
2. WHEN a car has no video_url, THE Gallery SHALL hide the Video tab completely
3. WHEN a car has a video_url, THE Gallery SHALL display the Video tab
4. THE Gallery SHALL default to the "All Photos" tab on page load
5. WHEN the user clicks a tab, THE Gallery SHALL switch to display the corresponding content

### Requirement 3: Image Zoom Controls

**User Story:** As a car buyer, I want to zoom in on car images, so that I can inspect details closely.

#### Acceptance Criteria

1. THE Gallery SHALL display a floating control bar on the main image
2. THE Zoom_Controls SHALL include a Zoom In (+) button
3. THE Zoom_Controls SHALL include a Zoom Out (-) button
4. THE Zoom_Controls SHALL include Left/Right carousel navigation arrows
5. WHEN the user clicks Zoom In, THE Gallery SHALL increase the image scale using CSS transform
6. WHEN the user clicks Zoom Out, THE Gallery SHALL decrease the image scale using CSS transform
7. THE Gallery SHALL use CSS `transform: scale()` for zoom operations to enable GPU acceleration
8. THE Gallery SHALL NOT cause layout shifts during zoom interactions
9. THE Gallery SHALL constrain zoomed images within the container bounds
10. WHEN the user clicks the Left arrow, THE Gallery SHALL display the previous image in the array
11. WHEN the user clicks the Right arrow, THE Gallery SHALL display the next image in the array
12. WHEN at the first image and clicking Left, THE Gallery SHALL wrap to the last image
13. WHEN at the last image and clicking Right, THE Gallery SHALL wrap to the first image

### Requirement 4: Video Player Integration

**User Story:** As a car buyer, I want to watch car videos in a premium player, so that I can see the vehicle in motion.

#### Acceptance Criteria

1. WHEN the Video tab is active, THE Video_Player SHALL display an embedded YouTube or Vimeo player
2. THE Video_Player SHALL be fully responsive and auto-scale to the container width
3. THE Video_Player SHALL maintain a 16:9 aspect ratio
4. THE Video_Player SHALL support YouTube URLs (youtube.com, youtu.be)
5. THE Video_Player SHALL support Vimeo URLs (vimeo.com)
6. WHEN a video exists, THE Video tab Play icon SHALL display a subtle pulse animation
7. IF an invalid video URL is provided, THEN THE Video_Player SHALL display a fallback error message

### Requirement 5: Custom SVG Icon Mapping

**User Story:** As a car buyer, I want visually distinct icons for each specification, so that I can quickly identify car attributes.

#### Acceptance Criteria

1. THE Car Overview section SHALL use `car-muscle-design-svgrepo-com.svg` for Body Type
2. THE Car Overview section SHALL use `car-front-svgrepo-com.svg` for Drive Type
3. THE Car Overview section SHALL use `condition-document-law-svgrepo-com.svg` for Condition
4. THE Car Overview section SHALL use `engine-motor-svgrepo-com.svg` for Engine Size
5. THE Car Overview section SHALL use `car-door-left-4-svgrepo-com.svg` for Doors
6. THE Car Overview section SHALL use `cylinder-svgrepo-com.svg` for Cylinders
7. THE Car Overview section SHALL use `color-adjustement-mode-channels-svgrepo-com.svg` for Color
8. THE icons SHALL render at 24x24 pixels
9. THE icons SHALL use color #050B20 (Primary) in default state
10. THE icons SHALL use color #405FF2 (Secondary) in active/hover state

### Requirement 6: Luxury Mobile Navigation

**User Story:** As a mobile user, I want a premium bottom navigation bar, so that I can easily navigate the site while viewing car details.

#### Acceptance Criteria

1. THE Mobile_Navigation SHALL be visible only on mobile viewport widths (< 640px)
2. THE Mobile_Navigation SHALL use glassmorphism styling: `bg-white/60`, `backdrop-blur-xl`, `border-t border-white/20`
3. THE Mobile_Navigation SHALL include safe area padding: `pb-[env(safe-area-inset-bottom, 20px)]`
4. THE Mobile_Navigation SHALL display four icons: Home, Cars, Contact, Search
5. WHEN the user taps the Home icon, THE Mobile_Navigation SHALL navigate to the home page
6. WHEN the user taps the Cars icon, THE Mobile_Navigation SHALL navigate to the cars listing page
7. WHEN the user taps the Contact icon, THE Mobile_Navigation SHALL navigate to the contact page
8. WHEN the user taps the Search icon, THE Mobile_Navigation SHALL scroll to the AI Search Bar on the current page
9. THE Mobile_Navigation SHALL remain fixed at the bottom of the viewport
10. THE Mobile_Navigation SHALL have a z-index above page content but below modals

### Requirement 7: Animation and Performance

**User Story:** As a car buyer, I want smooth animations without jank, so that the browsing experience feels premium.

#### Acceptance Criteria

1. THE Gallery zoom animations SHALL use CSS transforms for GPU acceleration
2. THE Gallery carousel transitions SHALL be smooth without layout shifts
3. THE Video tab pulse animation SHALL be subtle and non-distracting
4. WHILE zooming or navigating the carousel, THE Gallery SHALL NOT cause Cumulative Layout Shift (CLS)
5. THE Mobile_Navigation backdrop blur SHALL render smoothly on supported devices
6. IF backdrop-filter is not supported, THEN THE Mobile_Navigation SHALL fall back to a solid semi-transparent background
