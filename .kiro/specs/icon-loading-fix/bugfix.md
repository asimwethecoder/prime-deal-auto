# Bugfix Requirements Document

## Introduction

The `DynamicIcon` component makes HEAD requests to check if SVG files exist in `/public/icons/` before falling back to Lucide icons. When the Checkbox component uses `DynamicIcon name="check"`, it triggers a HEAD request to `/icons/check.svg` which doesn't exist, causing 404 errors in the console. Additionally, the async nature of this check causes unnecessary loading states and potential preload warnings.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN `DynamicIcon` is rendered with `name="check"` THEN the system makes a HEAD request to `/icons/check.svg` which returns 404 Not Found

1.2 WHEN `DynamicIcon` is rendered with any icon name THEN the system shows a loading placeholder while checking if the SVG exists, causing visual flicker

1.3 WHEN `DynamicIcon` checks for SVG existence THEN the system makes a network request on every render/mount, even for icons that are known to not exist as SVGs

1.4 WHEN multiple `DynamicIcon` components with the same name are rendered THEN the system makes duplicate HEAD requests for the same icon

### Expected Behavior (Correct)

2.1 WHEN `DynamicIcon` is rendered with `name="check"` THEN the system SHALL directly use the Lucide `Check` icon without making a network request

2.2 WHEN `DynamicIcon` is rendered with a Lucide-compatible icon name THEN the system SHALL check Lucide icons first before attempting to load a custom SVG

2.3 WHEN `DynamicIcon` is rendered THEN the system SHALL avoid showing loading placeholders for icons that can be resolved synchronously from Lucide

2.4 WHEN multiple `DynamicIcon` components with the same name are rendered THEN the system SHALL cache the SVG existence check result to avoid duplicate requests

### Unchanged Behavior (Regression Prevention)

3.1 WHEN `DynamicIcon` is rendered with a custom SVG icon name (e.g., "audi-svgrepo-com") THEN the system SHALL CONTINUE TO load and display the SVG from `/public/icons/`

3.2 WHEN `DynamicIcon` is rendered with a name that doesn't match any Lucide icon or custom SVG THEN the system SHALL CONTINUE TO display the "?" placeholder

3.3 WHEN `DynamicIcon` is rendered with custom width, height, and className props THEN the system SHALL CONTINUE TO apply these props correctly to both SVG and Lucide icons

3.4 WHEN `DynamicIcon` is rendered with `aria-hidden` prop THEN the system SHALL CONTINUE TO pass this accessibility attribute to the rendered icon
